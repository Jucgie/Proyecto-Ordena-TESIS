import styled from "styled-components";

interface Props{
    funcion?:()=>void;
    titulo?:string;
    background?:string;
    url?:string;
}
interface CProps{
    $background?:string;
}

export function Btn ({funcion, titulo, background, url}:Props) {
    return(
        <Container type="submit" $background={background}>
            <span className="btn" onClick={funcion}>
                <a href={url} target="_blank">
                    {titulo}
                </a>
            </span>
        </Container>

    );
}

const Container = styled.button<CProps>`
    display:flex;
    border:none;
    background-color:initial;
    justify-content:center;
    align-items:center;

    .btn{
        background: ${(props)=>props.$background};
        padding:0.2em 4em;
        font-size:19px;
        border-radius:10px;
        cursor:pointer;


        a{
            color:white;
        }

    }


`