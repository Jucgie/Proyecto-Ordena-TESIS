import styled from "styled-components";

interface Props{
    funcion?:()=>void;
    titulo?:React.ReactNode;
    background?:string;
    url?:string;
}
interface CProps{
    $background?:string;
}

export function BtnHistorial ({funcion, titulo, background, url}:Props) {
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
    padding:0px;
    border: 1px solid rgb(36, 34, 34);


    .btn{
        background: ${(props)=>props.$background};
        padding:0.2em 4em;
        font-size:19px;
        border-radius:5px;
        cursor:pointer;
        padding:60px;


        a{
            color:#FFD700;
            font-weight:bold;
            text-align:end;
        }
        
        &:hover{
            border: 2px solid white;
        }

    }


`


export function BtnAct ({funcion, titulo, background, url}:Props) {
    return(
        <ContainerB type="submit" $background={background}>
            <span className="btn" onClick={funcion}>
                <a href={url} target="_blank">
                    {titulo}
                </a>
            </span>
        </ContainerB>

    );
}

const ContainerB = styled.button<CProps>`
    display:flex;
    border:none;
    background-color:initial;
    justify-content:center;
    align-items:center;
    padding:0px;
    border: 2px solid #FFD700;

    .btn{
        background: ${(props)=>props.$background};
        padding:0.3em 0.2em;
        font-size:18px;
        border-radius:5px;
        cursor:pointer;

        a{
            color:#FFD700;
            padding:5px;
        }

    }
    
    


`